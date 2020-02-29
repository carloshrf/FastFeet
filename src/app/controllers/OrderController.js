import * as Yup from 'yup';
import { parseISO, format, setHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import File from '../models/File';
import Order from '../models/Order';

class OrderController {
  async index(req, res) {
    const order = await Order.findAll({
      where: { canceled_at: null },
      attributes: [
        'id',
        'recipient_id',
        'deliveryman_id',
        'product',
        'signature_id',
        'start_date',
        'end_date',
        'canceled_at',
      ],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: ['name'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
        {
          model: File,
          as: 'signature',
          attributes: ['name', 'path', 'url'],
        },
      ],
    });

    return res.json(order);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      product: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('Data validation fails');
    }

    const order = await Order.create(req.body);

    const orderInfo = await Order.findByPk(order.id, {
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'street',
            'number',
            'complement',
            'state',
            'city',
            'zipcode',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['name', 'email'],
        },
      ],
    });

    await Mail.sendMail({
      to: `${orderInfo.deliveryman.name} <${orderInfo.deliveryman.email}>`,
      subject: 'Nova Encomenda',
      template: 'newShipping',
      context: {
        deliveryman: orderInfo.deliveryman.name,
        product: orderInfo.product,
        number: orderInfo.recipient.number,
        complement: orderInfo.recipient.complement,
        street: orderInfo.recipient.street,
        city: orderInfo.recipient.city,
        state: orderInfo.recipient.state,
        zipcode: orderInfo.recipient.zipcode,
        name: orderInfo.recipient.name,
        date: format(orderInfo.createdAt, "dd'/'MM'/'y", { locale: pt }),
      },
    });

    return res.json(orderInfo);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string(),
      start_date: Yup.date(),
      end_date: Yup.date(),
      deliveryman_id: Yup.number(),
    });
    // Verifica a validação dos dados informados conforme definido
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation error' });
    }
    // Verifica se o canceled está sendo passado, o mesmo deverá ser passado apenas pelo método delete
    if (req.body.canceled_at) {
      return res.status(401).json({
        error: 'Cancelations must be defined only in cancelation section',
      });
    }
    // Consulta a existencia do registro
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(400).json({ error: 'Order does not exists' });
    }
    // Recebe a data de início, formata para Date e verifica se é entre 8 às 18
    const start_date = parseISO(req.body.start_date);

    if (start_date.getHours() >= '8' && start_date.getHours() <= '17') {
      order.start_date = start_date;
    } else
      return res
        .status(400)
        .json({ error: 'orders only be started between 7 at 18 hours' });
    // Na existencia da id de signature no corpo da requisição, o mesmo sobrescreverá o valor registrado
    if (req.body.signature_id) {
      order.signature_id = req.body.signature_id;
    }

    const newOrder = await order.update(req.body);
    return res.json(newOrder);
  }

  async delete(req, res) {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      res.json(400).json({ error: 'Order ID does not exists' });
    }

    order.canceled_at = new Date();

    order.save();

    return res.json(order);
  }
}

export default new OrderController();
